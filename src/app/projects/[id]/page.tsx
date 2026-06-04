'use client';

import { useParams } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { WBSItemWithChildren } from '@/types';
import Link from 'next/link';

// Mock function to get project by ID
function getProjectById(id: string, projects: any[]) {
  return projects.find(project => project.id === id);
}

// Mock function to get WBS items for a project
function getWBSItemsByProjectId(projectId: string) {
  // This would normally come from an API call
  const mockWBSItems: WBSItemWithChildren[] = [
    {
      id: '1',
      project_id: projectId,
      name: 'Phase 1',
      description: 'Initial project phase',
      weight: 30,
      progress: 45,
      planned_start: new Date(),
      planned_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'In Progress',
      sort_order: 1,
      created_at: new Date(),
      updated_at: new Date(),
      parent_id: undefined,
      children: [
        {
          id: '1-1',
          project_id: projectId,
          name: 'Design',
          description: 'System design',
          weight: 15,
          progress: 60,
          planned_start: new Date(),
          planned_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: 'In Progress',
          sort_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
          parent_id: '1',
          children: [],
        },
        {
          id: '1-2',
          project_id: projectId,
          name: 'Development',
          description: 'Implementation',
          weight: 15,
          progress: 30,
          planned_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          planned_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'Not Started',
          sort_order: 2,
          created_at: new Date(),
          updated_at: new Date(),
          parent_id: '1',
          children: [],
        }
      ]
    },
    {
      id: '2',
      project_id: projectId,
      name: 'Phase 2',
      description: 'Second project phase',
      weight: 40,
      progress: 10,
      planned_start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      planned_end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: 'Not Started',
      sort_order: 2,
      created_at: new Date(),
      updated_at: new Date(),
      parent_id: undefined,
      children: []
    }
  ];
  
  return mockWBSItems;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { projects } = useProjects();
  const projectId = params.id as string;
  
  const project = getProjectById(projectId, projects);
  
  if (!project) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Project Not Found</CardTitle>
            <CardDescription>The requested project could not be found</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const wbsItems = getWBSItemsByProjectId(projectId);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground mt-2">{project.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <p>
                  <Badge 
                    variant={
                      project.status === 'Active' ? 'default' :
                      project.status === 'Completed' ? 'secondary' :
                      project.status === 'Cancelled' ? 'destructive' : 'outline'
                    }
                  >
                    {project.status}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Start Date</span>
                <p>{new Date(project.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">End Date</span>
                <p>{new Date(project.end_date).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={45} className="w-full" />
              <p className="text-center font-semibold">45%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button variant="outline" asChild>
                <Link href={`/projects/${projectId}/wbs`}>Manage WBS</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/projects/${projectId}/milestones`}>Manage Milestones</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/projects/${projectId}/scurve`}>View S-Curve</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wbs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wbs">Work Breakdown</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="scurve">S-Curve</TabsTrigger>
        </TabsList>
        <TabsContent value="wbs" className="space-y-4">
          <h2 className="text-xl font-semibold">Work Breakdown Structure</h2>
          <div className="space-y-4">
            {wbsItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <Badge 
                      variant={
                        item.status === 'Completed' ? 'secondary' :
                        item.status === 'In Progress' ? 'default' :
                        item.status === 'Delayed' ? 'destructive' : 'outline'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="w-full" />
                    <div className="flex justify-between text-sm">
                      <span>Start: {new Date(item.planned_start).toLocaleDateString()}</span>
                      <span>End: {new Date(item.planned_end).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {item.children && item.children.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                      {item.children.map((child) => (
                        <div key={child.id} className="py-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{child.name}</span>
                            <Badge 
                              variant={
                                child.status === 'Completed' ? 'secondary' :
                                child.status === 'In Progress' ? 'default' :
                                child.status === 'Delayed' ? 'destructive' : 'outline'
                              }
                            >
                              {child.status}
                            </Badge>
                          </div>
                          <div className="flex items-center mt-1">
                            <Progress value={child.progress} className="flex-1 mr-2" />
                            <span className="text-xs w-10">{child.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="milestones" className="space-y-4">
          <h2 className="text-xl font-semibold">Milestones</h2>
          <p>No milestones configured yet. <Link href={`/projects/${projectId}/milestones`} className="text-blue-600 hover:underline">Add Milestones</Link></p>
        </TabsContent>
        <TabsContent value="scurve" className="space-y-4">
          <h2 className="text-xl font-semibold">S-Curve Visualization</h2>
          <p>S-Curve visualization will be displayed here. <Link href={`/projects/${projectId}/scurve`} className="text-blue-600 hover:underline">View Full S-Curve</Link></p>
        </TabsContent>
      </Tabs>
    </div>
  );
}